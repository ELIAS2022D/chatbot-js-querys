import dotenv from "dotenv";
dotenv.config();

// 👉 Obtener el token de Provincia Seguros
const getProvinciaToken = async () => {
  const url = "https://authp.provinciaseguros.com.ar/auth/realms/ps/protocol/openid-connect/token";

  const body = new URLSearchParams({
    client_id: "ps2",
    client_secret: process.env.PROVINCIA_CLIENT_SECRET,
    username: process.env.PROVINCIA_USERNAME,
    password: process.env.PROVINCIA_PASSWORD,
    grant_type: "password",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`❌ Error HTTP ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  return data.access_token;
};

// 👉 Hacer la cotización
const cotizarVehiculo = async (token, datosUsuario = {}) => {
  const API_KEY = "84630d93-d8c2-40b3-ad3d-b82773c092b5";
  const url = `https://apimprod.provinciaseguros.com.ar/PS/PS-COTIZACION/2.2/cotizar?apikey=${API_KEY}`;

  // 🚨 TODO: Mapear datosUsuario al body real
  const body = {
    contacto: {
      dni: datosUsuario.dni || "12345678",
      cuit: "",
      nombre: datosUsuario.nombre || "PRUEBA",
      celular: datosUsuario.celular || "011-1111-1111",
      email: datosUsuario.email || "test@fake.com",
      canal: "WEB",
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
      modoDeCalculo: "N",
    },
    bien: {
      "40007_tipo": "1",
      "40012_anio": datosUsuario.anio || "2018",
      "40013_esOkm": "N",
      "40020_marca": datosUsuario.marca || "TOY",
      "40021_modelo": datosUsuario.modelo || "045307",
      "40008_uso": "1",
      "40220_ValorDelVehiculo": datosUsuario.valor || 19470000,
      "900008_codPostal": datosUsuario.cp || 1414,
      "40086_genero": "M",
      "40550_clausulaAjuste": 10,
      "40088_bonifAdicional": 1,
      "40102_limiteResponsabilidadCivil": 1,
      "40090_limiteMercosur": 4,
      "40082_roboContenido": "S",
      "40101_cobAdicComerciales": "N",
      "montoAccesorios": 0,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`❌ Error en cotización HTTP ${res.status} - ${text}`);

  return JSON.parse(text);
};

export { getProvinciaToken, cotizarVehiculo };
