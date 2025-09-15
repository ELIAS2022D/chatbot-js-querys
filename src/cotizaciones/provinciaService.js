import dotenv from "dotenv";
dotenv.config();

const provinciaAuthUrl = "https://authp.provinciaseguros.com.ar/auth/realms/ps/protocol/openid-connect/token";
const provinciaApiUrl = "https://apimprod.provinciaseguros.com.ar/PS/PS-COTIZACION/2.2/cotizar";
const provinciaApiKey = process.env.PROVINCIA_API_KEY;
const provinciaClientId = process.env.PROVINCIA_CLIENT_ID;
const provinciaClientSecret = process.env.PROVINCIA_CLIENT_SECRET;
const provinciaUsername = process.env.PROVINCIA_USERNAME;
const provinciaPassword = process.env.PROVINCIA_PASSWORD;

// 🔑 Obtener token con logging completo
export async function getProvinciaToken() {
  try {
    const bodyParams = new URLSearchParams({
      client_id: provinciaClientId,
      client_secret: provinciaClientSecret,
      username: provinciaUsername,
      password: provinciaPassword,
      grant_type: "password",
      scope: "openid" // opcional, algunas API lo requieren
    });

    console.log("🔹 Enviando request de token a Provincia...");
    console.log("URL:", provinciaAuthUrl);
    console.log("Body:", Object.fromEntries(bodyParams));

    const res = await fetch(provinciaAuthUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: bodyParams
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("❌ Error al obtener token Provincia:", res.status, text);
      throw new Error(`Error al obtener token Provincia: ${res.status} - ${text}`);
    }

    const data = JSON.parse(text);
    console.log("✅ Token obtenido correctamente:", data.access_token ? "Sí" : "No");
    return data.access_token;

  } catch (err) {
    console.error("❌ Excepción en getProvinciaToken:", err.message);
    throw err;
  }
}

// 🚗 Cotizar vehículo usando datos del cliente + defaults
export async function cotizarVehiculoConDatos(token, formLines) {
  const [nombre, dni, modelo, patente, nacimiento, localidad] = formLines;

  const body = {
    contacto: {
      dni,
      cuit: "",
      nombre,
      celular: "011-1111-1111", // default
      email: "test@fake.com",   // default
      canal: "WEB"
    },
    ramoProducto: { ramo: "4", producto: "04100" },
    datosGenerales: {
      provincia: "1",
      tipoPersona: "F",
      medioDePago: "2",
      origenDePago: "VISO",
      condicionIva: "CF",
      cuit: "",
      vigencia: "E",
      vigenciaTecnica: "A",
      tipoFacturacion: "F",
      moneda: "01",
      planDePago: "1",
      modoDeCalculo: "N"
    },
    bien: {
      "40007_tipo": "1",
      "40012_anio": extraerAnio(modelo),
      "40013_esOkm": "N",
      "40020_marca": extraerMarca(modelo),
      "40021_modelo": extraerCodigoModelo(modelo),
      "40008_uso": "1",
      "40220_ValorDelVehiculo": 20000000,
      "900008_codPostal": mapearLocalidad(localidad),
      "40086_genero": "M",
      "40550_clausulaAjuste": 10,
      "40088_bonifAdicional": 1,
      "40102_limiteResponsabilidadCivil": 1,
      "40090_limiteMercosur": 4,
      "40082_roboContenido": "S",
      "40101_cobAdicComerciales": "N",
      "montoAccesorios": 0
    }
  };

  const res = await fetch(`${provinciaApiUrl}?apikey=${provinciaApiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error API Provincia: ${res.status} - ${text}`);
  }

  return await res.json();
}

// --- Helpers para mapear datos del cliente ---
function extraerAnio(modelo) {
  const match = modelo.match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : "2018";
}

function extraerMarca(modelo) {
  if (modelo.toLowerCase().includes("toy")) return "TOY";
  if (modelo.toLowerCase().includes("ford")) return "FOR";
  return "GEN";
}

function extraerCodigoModelo(modelo) {
  return "045307"; // TODO: usar catálogo real
}

function mapearLocalidad(localidad) {
  if (localidad.toLowerCase().includes("caba")) return 1414;
  if (localidad.toLowerCase().includes("la plata")) return 1900;
  return 1414;
}
