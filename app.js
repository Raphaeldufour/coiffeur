import express from 'express';
import sqlite3 from 'sqlite3';
import bodyParser from 'body-parser';
import bcrypt from "bcrypt";
import randomstring from "randomstring";

const app = express();
app.use(express.static('public'));
app.use(bodyParser.json());

const db = new sqlite3.Database('database/database.db');

function dontContainsLetters(str) {
    return !/[a-zA-Z]/.test(str);
}

function containsDigits(string) {
    return /\d/.test(string);
}

function okayForEdit(newInfos) {
    let isOkay = true;
    if (
        isNaN(newInfos[1]) || newInfos[1].includes(' ') || newInfos[1] === '' ||
        isNaN(newInfos[3]) || newInfos[3].includes(' ') || newInfos[3] === '' ||
        isNaN(newInfos[5]) || newInfos[5].includes(' ') || newInfos[5] === '' || Math.abs(parseFloat(newInfos[5])) > 90 ||
        isNaN(newInfos[6]) || newInfos[6].includes(' ') || newInfos[6] === '' || Math.abs(parseFloat(newInfos[6])) > 180
    ) {
        isOkay = false;
    } else if (
        dontContainsLetters(newInfos[0]) ||
        dontContainsLetters(newInfos[2]) ||
        dontContainsLetters(newInfos[4]) || containsDigits(newInfos[4])
    ) {
        isOkay = false;
    }
    return isOkay;
}


app.get('/api/hairdressers', (req, res) => {
    const filter = req.query.filter || '';
    const offset = parseInt(req.query.index) || 0;
    db.all('SELECT * FROM Coiffeurs WHERE nom LIKE ? or ville LIKE ? ORDER BY nom LIMIT 10 OFFSET ?', [`%${filter}%`, `%${filter}%`, offset], (err, hairdressers) => {
        if (err)
            return res.status(500).json({message: 'Erreur lors de la récupération des coiffeurs'});
        db.get('SELECT COUNT(*) AS count FROM Coiffeurs  WHERE nom LIKE ? or ville LIKE ?', [`%${filter}%`, `%${filter}%`], (err, count) => {
            if (err)
                return res.status(500).json({message: 'Erreur lors de la récupération du nombre de coiffeurs'});
            res.json({
                hairdressers: hairdressers,
                totalNumber: count ? count.count : 0
            });
        });
    });
});

app.put('/api/hairdressers', verifyToken, (req, res) => {
    const data = req.body;
    const id = data.id;
    const newInfos = [data.newInfos.nom, data.newInfos.num, data.newInfos.voie, data.newInfos.codepostal, data.newInfos.ville, data.newInfos.lat, data.newInfos.lng];

    if (okayForEdit(newInfos)) {

        const name = newInfos[0];
        const num = newInfos[1];
        const voie = newInfos[2];
        const codepostal = newInfos[3];
        const ville = newInfos[4];
        const lat = newInfos[5];
        const lng = newInfos[6];

        db.run('UPDATE Coiffeurs SET nom = ?, lat = ?, lng = ?, num = ?, voie = ?, ville = ?, codepostal = ? WHERE id = ?', [name, lat, lng, num, voie, ville, codepostal, id], (err) => {
            if (err) {
                res.status(500).json({message: 'Erreur lors de la modification du coiffeur'});
            } else {

                res.json({message: 'Coiffeur modifié avec succès'});
            }
        });
    } else {
        res.status(500).json({message: 'Erreur : certains champs n\'ont pas été remplis ou sont incorrects'});
    }
});


app.post('/api/hairdressers', verifyToken, (req, res) => {
    const data = req.body;

    const newInfos = [data.newInfos.nom, data.newInfos.num, data.newInfos.voie, data.newInfos.codepostal, data.newInfos.ville, data.newInfos.lat, data.newInfos.lng];

    if (okayForEdit(newInfos)) {
        const name = newInfos[0];
        const num = newInfos[1];
        const voie = newInfos[2];
        const codepostal = newInfos[3];
        const ville = newInfos[4];
        const lat = newInfos[5];
        const lng = newInfos[6];

        db.run('INSERT INTO Coiffeurs (nom, lat, lng, num, voie, ville, codepostal) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, lat, lng, num, voie, ville, codepostal], (err) => {
            if (err) {
                res.status(500).json({message: 'Erreur lors de la création du coiffeur'});
            } else {
                res.json({message: 'Coiffeur ajouté'});
            }
        });
    } else {
        res.status(500).json({message: 'Erreur : certains champs n\'ont pas été remplis ou sont incorrects'});
    }
});


function deleteExpiredToken() {
    db.run('DELETE FROM Tokens WHERE expirationDate < ?', Date.now(), (err) => {
        if (err) {
            console.log('Erreur lors de la suppression des tokens expirés');
        }
    });
}

app.post('/user', async (req, res) => {
    const emailBody = req.body.email;
    const passwordBody = req.body.password;
    db.get('SELECT * FROM Utilisateurs WHERE email = ?', [emailBody], async (err, user) => {
        if (err) {
            res.status(500).json({message: 'Erreur lors de la récupération de l\'utilisateur'});
        } else if (user) {
            const passwordCorrect = await bcrypt.compare(passwordBody, user.password);
            if (passwordCorrect) {
                const token = randomstring.generate();
                const expirationDate = Date.now() + 86400000;
                db.run('INSERT INTO Tokens (token, user_id, expirationDate) VALUES (?, ?, ?)', [token, user.id, expirationDate], (err) => {
                    if (err) {
                        res.status(500).json({message: 'Erreur lors de la création du token'});
                    } else {
                        res.json({token: token});
                    }
                });
                deleteExpiredToken();
            } else {
                res.status(401).json({message: 'Mot de passe incorrect'});
            }
        } else {
            res.status(401).json({message: 'Email incorrect'});
        }
    });
});

function verifyToken(req, res, next) {
    // Récupérer le token de l'en-tête de la requête
    const token = req.headers['authorization'];
    if (token === 'null' || token == null) {
        return res.status(401).json({message: 'Token manquant'})
    }
    db.get('SELECT * FROM Tokens WHERE token = ?', token, (err, token) => {
        if (err) {
            return res.status(500).json({message: 'Erreur lors de la récupération du token'})
        } else if (token) {
            if (Date.now() > token.expirationDate) {
                return res.status(401).json({message: 'Token expiré'})
            } else {
                next();
            }
        } else {
            return res.status(401).json({message: 'Token invalide'})
        }
    });
}

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
})