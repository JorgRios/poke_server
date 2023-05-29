const {Socket} = require("socket.io");
const app = require('express')();
const httpServer = require('http').createServer(app);

const io = require('socket.io')(httpServer, {
    cors: {origin : '*'}
});

const port = process.env.PORT || 3000;
const users = [];
const fights = [];

io.on('connection', (socket) => {
    socket.on('login', (nombre) => {
        verificarUsuarioYModificar(users, nombre, socket.id);
        console.log('Usuarios :')
        console.log(users)
        io.emit('lista_usuarios', users);
    });
    socket.on('disconnect', () => {
        let user = obtenerDatosUsuarioporid(users,socket.id);
        if(user == null){
            console.log("el usuario "+socket.id+" se ha desconectado");    
        }
        desconectarUsuario(users,socket.id)
        console.log('Usuarios :')
        console.log(users)
        io.emit('lista_usuarios', users);
    })

    socket.on('pelea', (pokemon_id) => {
        console.log('Nueva pelea creada')
        let user = obtenerDatosUsuarioporid(users,socket.id);
        if(user.pokemon == 0){
            /**el usuario no tiene pokemon y se le asigna el q entro */
            actualizarDatosUsuario(users, socket.id , pokemon_id, 1)
        }else{
            if(user.pokemon != pokemon_id){
                user.nivel = 1
            }
        }        
        agregarPelea(fights, user.nombre)
        console.log("Peleas :")
        console.log(fights)
        console.log('Usuarios :')
        console.log(users)
        io.emit('lista_peleas', fights);
    })

    socket.on('buscar_pelea', (pokemon_id) => {
        actualizarDatosUsuario(users, socket.id , pokemon_id, 1)
        io.emit('lista_peleas', fights);
    })



    socket.on('aceptar', (retador) => {
        pelea = pelearYa(fights,retador, socket.id);
        console.log('Todas las Peleas: ')
        console.log(fights)
        console.log('la Pelea: ')
        console.log(pelea)
        io.emit('lista_peleas', fights);
        io.emit('arena', pelea);
    })
    /**
     * ya con las demas funciones
     */


})


function pelearYa(peleas, retador, idUsuario) {
    const pelea = peleas.find(pelea => pelea.retador === retador && pelea.estado === 'espera');
    const usuario = obtenerDatosUsuarioporid(users,idUsuario)
    if (pelea) {
      pelea.adversario = usuario.nombre;
      pelea.pk2 = usuario.pokemon;
      pelea.estado = 'progreso';
      pelea.ganador = null;
      console.log(`La pelea entre ${retador} y ${usuario.nombre} ha pasado al estado 'progreso'.`);
      return pelea;
    } else {
      console.log(`No se encontró una pelea en espera para el retador ${retador}.`);
      return null;
      
    }

}

function desconectarUsuario(arr, id) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].id === id) {
      arr[i].conectado = false;
      break;
    }
  }
}


function verificarUsuarioYModificar(arr, nombre, nuevo_id) {
    let usuarioEncontrado = false;
  
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].nombre === nombre) {
        arr[i].id = nuevo_id;
        arr[i].conectado = true;
        usuarioEncontrado = true;
        break;
      }
    }

    if (!usuarioEncontrado) {
      const nuevoUsuario = {
        nombre: nombre,
        id: nuevo_id,
        pokemon: 0,
        nivel: 0,
        conectado: true
      };
      arr.push(nuevoUsuario);
    }
}

function agregarPelea(peleas, retador) {
    const peleaExistente = peleas.find(pelea => pelea.retador === retador && pelea.estado === 'espera');
    if (peleaExistente) {
      console.log(`El retador ${retador} ya está en una pelea en espera.`);
      return peleas;
    }
    const retado = obtenerDatosUsuariopornombre(users,retador);
    const nuevaPelea = {
      retador: retado.nombre,
      adversario: null,
      ganador: null,
      pk1: retado.pokemon,
      pk2: 0,
      saludpk1: 100,
      saludpk2: 100,
      estado: 'espera'
    };
    peleas.push(nuevaPelea);
    console.log(`Se ha agregado una nueva pelea para el retador ${retador} en estado 'espera'.`);
    return peleas;
}


function obtenerDatosUsuariopornombre(arr, nombre) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].nombre === nombre) {
        return arr[i];
      }
    }
    return null; // Retorna null si no se encuentra el usuario en el array
}
  

function obtenerDatosUsuarioporid(arr, id) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].id === id) {
        return arr[i];
      }
    }
    return null; // Retorna null si no se encuentra el usuario en el array
}


function actualizarDatosUsuario(users, id, nuevoPokemon, nuevoNivel) {
    for (let i = 0; i < users.length; i++) {
      if (users[i].id === id) {
        users[i].pokemon = nuevoPokemon;
        users[i].nivel = nuevoNivel;
        break;
      }
    }
  }

httpServer.listen(port, () => console.log(`Servidor activo en puerto:  ${port}`));

app.get('/', (req, res) => {
  res.send('PokeServer Arriba! en puerto: '+port);
}) 
