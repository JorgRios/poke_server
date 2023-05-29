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
    socket.on('reconect',() => {
      console.log('reconectando usuario')
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

    socket.on('atacar',(danio) => {
      console.log('alguien esta mandando un ataque de daño '+danio)
      let user = obtenerDatosUsuarioporid(users,socket.id);
      let pelea_id = buscarIdPorNombre(fights, user.nombre)
      if(fights[pelea_id].retador == user.nombre){
        fights[pelea_id].saludpk2 = fights[pelea_id].saludpk2-danio;
        if(fights[pelea_id].saludpk2<=0)
        fights[pelea_id].saludpk2 = 0
        console.log('Retador Ataco!!')
        console.log('salud pk2 '+fights[pelea_id].saludpk2)
      }else{
        fights[pelea_id].saludpk1 = fights[pelea_id].saludpk1-danio;
        if(fights[pelea_id].saludpk1<=0)
        fights[pelea_id].saludpk1 = 0
        console.log('Adversario Ataco!!')
        console.log('salud pk1 '+fights[pelea_id].saludpk2)
      }

      if(fights[pelea_id].saludpk2 == 0 || fights[pelea_id].saludpk1 == 0){
        console.log('Pelea termino!!!');
        fights[pelea_id].estado = 'Finalizado';
        io.emit('lista_peleas', fights);
        io.emit('arena', fights[pelea_id]);
        io.emit('finalizada', deliverar(fights[pelea_id]))
        //emite finalizar
      }else{
        console.log('pelea continua...')
        ///emite arena!!
        io.emit('lista_peleas', fights);
        io.emit('arena', fights[pelea_id]);
      }
      console.log(fights[pelea_id])
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
      pelea.saludpk2 = 100;
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

function deliverar(arr){
  let ganador = '';
  if(arr.saludpk1 == 0){
    ganador = arr.adversario;
  }
  if(arr.saludpk2 == 0){
    ganador = arr.retador;
  }
  return ganador;
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

function buscarIdPorNombre(peleas, nombre) {
  for (let i = 0; i < peleas.length; i++) {
    const pelea = peleas[i];
    if (pelea.estado === 'progreso' && (pelea.retador === nombre || pelea.adversario === nombre)) {
      return i;
    }
  }
  return null;
}

httpServer.listen(port, () => console.log(`Servidor activo en puerto:  ${port}`));

app.get('/', (req, res) => {
  res.send('PokeServer Arriba! en puerto: '+port);
}) 
