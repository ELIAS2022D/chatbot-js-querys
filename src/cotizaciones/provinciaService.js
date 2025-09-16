import dotenv from "dotenv";
dotenv.config();

const getProvinciaToken = async () => {
  const url = "https://authp.provinciaseguros.com.ar/auth/realms/ps/protocol/openid-connect/token";

  const body = new URLSearchParams({
    client_id: "ps2",
    client_secret: process.env.PROVINCIA_CLIENT_SECRET,
    username: process.env.PROVINCIA_USERNAME,
    password: process.env.PROVINCIA_PASSWORD,
    grant_type: "password"
  });

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  })
    .then(async res => {
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      return res.json();
    })
    .then(data => data.access_token)
    .catch(err => {
      console.error("❌ Error al obtener token:", err.message);
      throw err;
    });
};

const cotizarVehiculo = (token) => {
  const API_KEY = "84630d93-d8c2-40b3-ad3d-b82773c092b5";
  const url = `https://apimprod.provinciaseguros.com.ar/PS/PS-COTIZACION/2.2/cotizar?apikey=${API_KEY}`;

  const body = {
    contacto: {
      dni: "12345678",
      cuit: "",
      nombre: "PRUEBA",
      celular: "011-1111-1111",
      email: "test@fake.com",
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
      "40012_anio": "2018",
      "40013_esOkm": "N",
      "40020_marca": "TOY",
      "40021_modelo": "045307",
      "40008_uso": "1",
      "40220_ValorDelVehiculo": 19470000,
      "900008_codPostal": 1414,
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

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(body)
  })
    .then(async res => {
      const text = await res.text();
      if (!res.ok) throw new Error(`Error HTTP ${res.status} - ${text}`);
      return JSON.parse(text);
    })
    .then(data => {
      console.log("✅ Cotización recibida:", data);
      return data;
    })
    .catch(err => console.error("❌ Error en cotización:", err.message));
};

// --- Exportar funciones ---
export { getProvinciaToken, cotizarVehiculo };
