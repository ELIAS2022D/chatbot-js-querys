const hasBeenLongEnough = (lastTimeStamps, hours = 3) => {
    const timeNow = Date.now();

    // Si la diferencia es mayor a las horas establecidas como máximo devuelvo true
    const differenceInHours = (timeNow - lastTimeStamps) / (1000 * 60 * 60);
    return differenceInHours >= hours;
}

const formatCellphoneNumber = (cellphone) => cellphone.slice(0, -5)


export { hasBeenLongEnough, formatCellphoneNumber };
