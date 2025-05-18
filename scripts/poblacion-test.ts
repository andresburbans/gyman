// scripts/poblacion-test.ts

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp,
    Firestore,
    DocumentReference,
    DocumentData,
} from 'firebase/firestore';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredConfigKeys: (keyof typeof firebaseConfig)[] = [
    'apiKey',
    'authDomain',
    'projectId',
    'appId',
];
const missingKeys = requiredConfigKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
    console.error(
        `Error: Faltan variables de entorno de Firebase en .env.local: ${missingKeys.join(', ')}`
    );
    console.error('Asegúrate de que tu archivo .env.local esté configurado correctamente en la raíz del proyecto.');
    process.exit(1);
}

console.log('Variables de entorno cargadas. Project ID:', firebaseConfig.projectId);

let app: FirebaseApp;
let db: Firestore;
const DATABASE_ID = "gyman-test"; // <--- DEFINIMOS EL ID DE TU BASE DE DATOS

try {
    app = initializeApp(firebaseConfig);
    // Especificamos el ID de la base de datos al obtener Firestore
    db = getFirestore(app, DATABASE_ID); // <--- CAMBIO IMPORTANTE AQUÍ
    console.log(`Firebase SDK inicializado correctamente. Apuntando a la base de datos: ${DATABASE_ID}`);
} catch (error) {
    console.error('Error fatal inicializando Firebase SDK para el script:', error);
    process.exit(1);
}

async function testFirestoreConnection() {
    console.log(`\nIntentando crear colección y documentos de prueba en la base de datos '${DATABASE_ID}'...`);
    try {
        const testCollectionName = 'testConexionEspecificaDB'; // Nombre de la colección de prueba
        const testCollectionRef = collection(db, testCollectionName);

        const doc1Data = {
            name: `Documento 1 en ${DATABASE_ID}`,
            message: `¡Conexión exitosa al DB ID '${DATABASE_ID}' desde script!`,
            type: 'Test_Specific_DB',
            value: 400,
            createdAt: serverTimestamp(),
        };
        const doc1Ref: DocumentReference<DocumentData> = await addDoc(testCollectionRef, doc1Data);
        console.log(`Documento 1 agregado a '${testCollectionName}' en DB '${DATABASE_ID}' con ID: ${doc1Ref.id}`);

        const doc2Data = {
            name: `Documento 2 en ${DATABASE_ID}`,
            description: `Otro documento para confirmar la escritura en DB '${DATABASE_ID}'.`,
            status: `OK_DB_${DATABASE_ID}`,
            randomNumber: Math.floor(Math.random() * 4000),
            createdAt: serverTimestamp(),
        };
        const doc2Ref: DocumentReference<DocumentData> = await addDoc(testCollectionRef, doc2Data);
        console.log(`Documento 2 agregado a '${testCollectionName}' en DB '${DATABASE_ID}' con ID: ${doc2Ref.id}`);

        console.log('\n------------------------------------------------------------------');
        console.log(`¡PRUEBA DE CONEXIÓN Y ESCRITURA A DB '${DATABASE_ID}' COMPLETADA CON ÉXITO!`);
        console.log(`Revisa tu consola de Firebase Firestore, selecciona la base de datos '${DATABASE_ID}',`);
        console.log(`y busca la colección '${testCollectionName}'.`);
        console.log('------------------------------------------------------------------');
    } catch (error) {
        console.error('\n------------------------------------------------------------------');
        console.error(`ERROR DURANTE LA PRUEBA DE CONEXIÓN A FIRESTORE (DB: ${DATABASE_ID}):`, error);
        console.error('------------------------------------------------------------------');
        console.error('POSIBLES CAUSAS Y SOLUCIONES:');
        console.error('1. ¿Están correctas las credenciales en tu archivo .env.local?');
        console.error(`2. ¿El projectId ('${firebaseConfig.projectId}') es el correcto?`);
        console.error(`3. ¿Existe la base de datos con ID '${DATABASE_ID}' en tu proyecto Firestore? (Parece que sí por tu captura).`);
        console.error(`4. ¿Las reglas de seguridad para la base de datos '${DATABASE_ID}' permiten escrituras? (Revisa las reglas específicas para esta base de datos si es posible, o las reglas generales si aplican).`);
        console.error('5. ¿Tienes conexión a internet?');
        console.error('------------------------------------------------------------------');
    }
}

testFirestoreConnection()
    .then(() => {
        console.log(`\nScript de prueba (DB: ${DATABASE_ID}) finalizado.`);
    })
    .catch((e) => {
        console.error(`Error no controlado en testFirestoreConnection (DB: ${DATABASE_ID}):`, e);
    });