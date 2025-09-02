// Verifica si el archivo existe
const fileExists = async (filePath) => {
    try {
        await fs.access(filePath);
        console.log("Existe el archivo");
        return true;
    } catch {
        console.log("No existe el archivo");
        return false;
    }
};

const hasBeenLongEnough = (lastTimeStamps, hours = 3) => {
    const timeNow = Date.now();

    // Si la diferencia es mayor a las horas establecidas como máximo devuelvo true
    const differenceInHours = (ahora - timestamp) / (1000 * 60 * 60) ;
    return differenceInHours >= hours;
}


export { hasBeenLongEnough, fileExists };
