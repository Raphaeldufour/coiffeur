import express from 'express';
import sqlite3 from 'sqlite3';
import bodyParser from 'body-parser';
import bcrypt from "bcrypt";
import randomstring from "randomstring";

const app = express();
app.use(express.static('public'));
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});

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


function createQueryAndParams(searchIn, filter, orderBy, offset) {
    let query = '';
    let countQuery = '';
    let params = [];
    let countParams = [];

    switch (searchIn) {
        case 'name':
            query = 'SELECT * FROM Coiffeurs WHERE nom LIKE ? ORDER BY ' + orderBy + ' LIMIT 10 OFFSET ?';
            countQuery = 'SELECT COUNT(*) as total FROM Coiffeurs WHERE nom LIKE ?';
            params = [`%${filter}%`, offset];
            countParams = [`%${filter}%`];
            break;
        case 'number':
            query = 'SELECT * FROM Coiffeurs WHERE num LIKE ? ORDER BY ' + orderBy + ' LIMIT 10 OFFSET ?';
            countQuery = 'SELECT COUNT(*) as total FROM Coiffeurs WHERE num LIKE ?';
            params = [`%${filter}%`, offset];
            countParams = [`%${filter}%`];
            break;
        case 'street':
            query = 'SELECT * FROM Coiffeurs WHERE voie LIKE ? ORDER BY ' + orderBy + ' LIMIT 10 OFFSET ?';
            countQuery = 'SELECT COUNT(*) as total FROM Coiffeurs WHERE voie LIKE ?';
            params = [`%${filter}%`, offset];
            countParams = [`%${filter}%`];
            break;
        case 'postalCode':
            query = 'SELECT * FROM Coiffeurs WHERE codepostal LIKE ? ORDER BY ' + orderBy + ' LIMIT 10 OFFSET ?';
            countQuery = 'SELECT COUNT(*) as total FROM Coiffeurs WHERE codepostal LIKE ?';
            params = [`%${filter}%`, offset];
            countParams = [`%${filter}%`];
            break;
        case 'city':
            query = 'SELECT * FROM Coiffeurs WHERE ville LIKE ? ORDER BY ' + orderBy + ' LIMIT 10 OFFSET ?';
            countQuery = 'SELECT COUNT(*) as total FROM Coiffeurs WHERE ville LIKE ?';
            params = [`%${filter}%`, offset];
            countParams = [`%${filter}%`];
            break;
        case 'nameOrCity':
            query = 'SELECT * FROM Coiffeurs WHERE nom LIKE ? OR ville LIKE ? ORDER BY ' + orderBy + ' LIMIT 10 OFFSET ?';
            countQuery = 'SELECT COUNT(*) as total FROM Coiffeurs WHERE nom LIKE ? OR ville LIKE ?';
            params = [`%${filter}%`, `%${filter}%`, offset];
            countParams = [`%${filter}%`, `%${filter}%`];
            break;
    }
    return {query, countQuery, params, countParams};
}

app.get('/api/hairdressers', (req, res) => {
    const filter = req.query.filter || '';
    const offset = parseInt(req.query.index) || 0;
    const searchIn = req.query.searchIn || 'nameOrCity';
    const orderBy = req.query.orderBy || 'nom';

    let {query, countQuery, params, countParams} = createQueryAndParams(searchIn, filter, orderBy, offset);

    db.get(countQuery, countParams, (err, count) => {
        if (err) {
            res.status(500).json({message: 'Erreur lors du comptage des coiffeurs'});
        } else {
            db.all(query, params, (err, hairdressers) => {
                if (err) {
                    res.status(500).json({message: 'Erreur lors de la récupération des coiffeurs'});
                } else {
                    res.json({hairdressers: hairdressers, totalNumber: count.total});
                }
            });
        }
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

app.post('/api/favorites/:id', verifyToken, (req, res) => {
    const userId = req.userId;
    const hairdresserId = req.params.id;

    db.run('INSERT INTO Favoris (user_id, hairdresser_id) VALUES (?, ?)', [userId, hairdresserId], (err) => {
        if (err) {
            console.log(err);
            res.status(500).json({message: 'Erreur lors de l\'ajout du coiffeur aux favoris'});
        } else {
            res.json({message: 'Coiffeur ajouté aux favoris'});
        }
    });
});

app.delete('/api/favorites/:id', verifyToken, (req, res) => {
    const userId = req.userId;
    const hairdresserId = req.params.id;

    db.run('DELETE FROM Favoris WHERE user_id = ? AND hairdresser_id = ?', [userId, hairdresserId], (err) => {
        if (err) {
            res.status(500).json({message: 'Erreur lors de la suppression du coiffeur des favoris'});
        } else {
            res.json({message: 'Coiffeur supprimé des favoris'});
        }
    });
});

app.get('/api/favorites', verifyToken, (req, res) => {
    const userId = req.userId;

    db.all('SELECT hairdresser_id FROM Favoris WHERE user_id = ?', [userId], (err, favorites) => {
        if (err) {
            res.status(500).json({message: 'Erreur lors de la récupération des favoris'});
        } else {
            // Map the favorites array to only include the hairdresser_id
            const favoriteIds = favorites.map(favorite => favorite.hairdresser_id);
            res.json(favoriteIds);
        }
    });
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
                req.userId = token.user_id;
                next();
            }
        } else {
            return res.status(401).json({message: 'Token invalide'})
        }
    });
}

app.listen(8401, () => {
    console.log('Server is running on port 8401');
})