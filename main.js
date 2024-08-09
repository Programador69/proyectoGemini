import { GoogleGenerativeAI } from "@google/generative-ai";
import markdownit from 'markdown-it'

// creando el markdown (MD) para poder usarlo despues
const md = markdownit();

// configurando e inicializando el speechSynth
const synth = window.speechSynthesis

// integrando la API de GEMINI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY);
const model = genAI.getGenerativeModel({model: "gemini-1.5-flash"});

// obteniendo los elementos que usaremos para los eventos y algunos cambios
const formualrio = document.querySelector(".formulario");
const botonLimpieza = document.querySelector(".botonLimpiar");
const inputConsulta = document.querySelector(".inputConsulta");
const respuestaConsulta = document.querySelector(".respuesta");

// generando el objetivo y un historial para el chat
const objetivo = `Deberas que simular ser un doctor y daras respuesta de paso a paso como prevenir, evitar o ayudar a curar ante cualquier situacion que te digan, sabiendo que solo es ayuda de primera linea antes de ser atendido por un doctor. Ademas deberas que contestar en el mismo idioma en el que se te pregunta y al final daras las ubicaciones de los hospitales mas cercanos a las coordenadas del ususario.`

let historial = [{
    role: "user",
    parts: [{text: objetivo}]
}, {
    role: "model",
    parts: [{text: "Entendido"}]
}]

// funcion para obtener las coordenadas del usuario
let latitud = "";
let longitud = "";
window.addEventListener("load", () => {
  navigator.geolocation.getCurrentPosition(pos => {
    latitud = pos.coords.latitude;
    longitud = pos.coords.longitude;
  })
})

// funcion para obtener la consulta de GEMINI AI
const consultaGemini = async (consulta) => {
  let chat = model.startChat({history: historial});

  // checar si tenemos coordenadas y enviarlas a GEMINI, asi nos devuelve los hospitales cercanos
  let resultado;
  if (latitud == "" && longitud == "") {
    resultado = await chat.sendMessage(consulta);
  }else {
    resultado = await chat.sendMessage(consulta + `mis coordenadas son: ${latitud}, ${longitud}`);
  }

  
  const respuesta = md.render(resultado.response.text());

  const textoPorHablar = new SpeechSynthesisUtterance(respuesta);
  textoPorHablar.rate = 2;
  textoPorHablar.pitch = 1.5;
  synth.speak(textoPorHablar);

  respuestaConsulta.innerHTML += "<br/>" + `${respuesta}` + "--------------------";

}

// evento obtenido en cuando el formulario haga un submit
formualrio.addEventListener("submit", (e) => {
  e.preventDefault();

  const consulta = inputConsulta.value;
  inputConsulta.value = "";

  if (consulta == undefined || consulta == "") {
    return;
  }

  // cancelar el speech para que anuncie la nueva respuesta antes de acabar la otra
  synth.cancel();

  // llamar a la funcion para la consulta a gemini 
  consultaGemini(consulta);
})

// evento obtenido cuando el se clikea el boton de "limpiar"
botonLimpieza.addEventListener("click", () => {
  respuestaConsulta.textContent = "";
})