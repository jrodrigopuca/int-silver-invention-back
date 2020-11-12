/**
 * @description: API/REST considerando JWT + consumo de datos
 * @author: jarp
 */

// inicializar
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const config = require('./config/config');
const usuarios = require('./config/usuarios');
const fetch = require('node-fetch');
const app = express();

/**
 * @description
 * @param res: true/false según lo devuelto por la petición 
 * @param data: valores devueltos
 * @returns json con estructura en común para cualquier petición
 */
const respuesta = (resultado,data)=>{
    return {res: resultado, data: data};
}

app.set('key', config.key)

app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

app.listen(3001, ()=>{
    console.info('server funcionando')
})
app.get('/', (req, res)=>{
    res.json(respuesta(true,'Hola mundo'));
})



/**
 * @description: 
 * - buscar en una lista el usuario/pass
 * - en caso de encontrarlo validar pass
 * - en caso de no encontrarlo ó con mala pass: mostrar 401 
 */
app.post('/login', (req,res)=>{
    let seleccionado=usuarios.filter(x=>(x.user.toLowerCase()===req.body.user.toLowerCase()));
    if (seleccionado.length){ 
        if (seleccionado[0].pass == req.body.pass){
            const token = jwt.sign(
                {check:true},
                app.get('key'),
                {   algorithm:"HS512", expiresIn: '1h'})
            res.json(respuesta(true,token))
        }
        else{
            res.status(401).json(respuesta(false,"contraseña incorrecta"));
        }
    }
    else{
        res.status(401).json(respuesta(false,"datos incorrectos"));
    }
})

/**
 * @description: 
 * - middleware para validar el token
 * - token válido: continuar (next)
 * - token inexistente o no verificable: cancelar solicitud
 */
const usarToken = express.Router();
usarToken.use((req,res,next)=>{
    const token = req.headers['authorization'];
    if (token){
        jwt.verify(token, app.get('key'),(err, decoded)=>{
            if(err){
                return res.status(403).json(respuesta(false,'Token no válido'))
            } 
            else{
                req.decoded = decoded;
                next(); //seguir con los datos
            }
        })
    } 
    else {
        res.status(401).json(respuesta(false,'Sin token'))
    }
})

/**
 * 
 */

app.get('/posts', usarToken, (req, res)=>{
    fetch('http://jsonplaceholder.typicode.com/posts')
        .then(resLocal=>resLocal.json())
        .then(json=>
                res.json(respuesta(true,json))
        )
})

app.get('/fotos', usarToken, (req, res)=>{
    fetch('http://jsonplaceholder.typicode.com/photos')
        .then(resLocal=>resLocal.json())
        .then(json=>
                res.json(respuesta(true,json))
        )
})