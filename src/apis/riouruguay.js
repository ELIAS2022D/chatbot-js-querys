import axios from "axios";

const RIO_API = "https://api.riouruguayseguros.com"; // cambiar por URL real

export class RioUruguayAPI {
  constructor(usuario, clave) {
    this.usuario = usuario;
    this.clave = clave;
    this.token = null;
  }

  async login() {
    try {
      const res = await axios.post(`${RIO_API}/auth/login`, {
        usuario: this.usuario,
        clave: this.clave
      });
      this.token = res.data.token;
      return this.token;
    } catch (err) {
      console.error("Error al loguear Río Uruguay:", err.response?.data || err);
      throw err;
    }
  }

  async request(method, endpoint, data = {}) {
    if (!this.token) {
      await this.login();
    }

    try {
      const res = await axios({
        method,
        url: `${RIO_API}${endpoint}`,
        headers: { Authorization: `Bearer ${this.token}` },
        data
      });
      return res.data;
    } catch (err) {
      console.error(`Error en Río Uruguay (${endpoint}):`, err.response?.data || err);
      throw err;
    }
  }
}
