import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";
import readline from "readline";

const db = new sqlite3.Database('database.db');

const saltRounds = 10;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function hashPassword(password) {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return {salt, hash};
}

async function createNewUser() {
    rl.question('Entrez votre email: ', async (email) => {
        rl.question('Entrez votre mot de passe: ', async (password) => {
            const {salt, hash} = await hashPassword(password);
            db.run(`INSERT INTO Utilisateurs (email, password) VALUES (?, ?)`, [email, hash], (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Utilisateur créé avec succès");
                }
                rl.close();
            });
        });
    });
}

createNewUser();

