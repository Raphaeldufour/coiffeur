import fs from 'fs';
import sqlite3 from 'sqlite3';


const rawData = fs.readFileSync('coiffeurs.json');
const jsonData = JSON.parse(rawData);


const db = new sqlite3.Database('database.db');


// Créer une table pour stocker les enseignes de coiffure
db.serialize(async () => {

    db.run('DROP TABLE IF EXISTS hairdressers');

    db.run('DROP TABLE IF EXISTS Coiffeurs');
    db.run('DROP TABLE IF EXISTS Favoris');

    db.run(` 
 CREATE TABLE IF NOT EXISTS Coiffeurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom VARCHAR(30),
    lat Decimal(8,6),
    lng Decimal(9,6),
    num INTEGER,
    voie VARCHAR(100),
    ville VARCHAR(50),
    codepostal INTEGER
  );`);
    db.run(`
CREATE TABLE IF NOT EXISTS Utilisateurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
);`);

    db.run('CREATE TABLE IF NOT EXISTS Tokens(token VARCHAR(255) NOT NULL, user_id int, expirationDate DATE , PRIMARY KEY (token), FOREIGN KEY (user_id) REFERENCES Utilisateurs(id))');

    db.run(`
    CREATE TABLE IF NOT EXISTS Favoris (
    user_id INTEGER,
    hairdresser_id INTEGER,
    PRIMARY KEY (user_id, hairdresser_id),
    FOREIGN KEY (user_id) REFERENCES Utilisateurs(id),
    FOREIGN KEY (hairdresser_id) REFERENCES Coiffeurs(id)
);`);
    // Insérer les données du fichier JSON dans la table
    const insertStmt = db.prepare(`INSERT INTO Coiffeurs (
    nom, lat, lng, num, voie, ville, codepostal
  ) VALUES (?, ?, ?, ?, ?, ?, ?)`);

    jsonData.data.features.forEach(feature => {
        const properties = feature.properties;
        insertStmt.run(
            properties.nom,
            properties.lat,
            properties.lng,
            properties.num,
            properties.voie,
            properties.ville,
            properties.codepostal
        );
    });
    insertStmt.finalize();
});

db.close();
