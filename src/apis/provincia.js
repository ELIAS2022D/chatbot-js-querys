import axios from "axios";

const PROVINCIA_API = "https://api.provinciaseguros.com"; // cambiar por URL real

export class ProvinciaAPI {
  constructor(usuario, clave) {
    this.usuario = usuario;
    this.clave = clave;
    this.token = null;
  }

  // Login
  async login() {
    try {
      const res = await axios.post(`${PROVINCIA_API}/auth/login`, {
        usuario: this.usuario,
        clave: this.clave
      });
      this.token = res.data.token;
      return this.token;
    } catch (err) {
      console.error("Error al loguear Provincia:", err.response?.data || err);
      throw err;
    }
  }

  // Llamada genérica a cualquier endpoint
  async request(method, endpoint, data = {}) {
    if (!this.token) {
      await this.login();
    }

    try {
      const res = await axios({
        method,
        url: `${PROVINCIA_API}${endpoint}`,
        headers: { Authorization: `Bearer ${this.token}` },
        data
      });
      return res.data;
    } catch (err) {
      console.error(`Error en Provincia (${endpoint}):`, err.response?.data || err);
      throw err;
    }
  }
}
