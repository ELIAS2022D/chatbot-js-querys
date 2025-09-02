const hasBeenLongEnough = (lastMessage, thresholdHours = 24) => {
  console.log("Evaluando si pasó el tiempo necesario desde el ultimo mensaje");

  console.log("Último mensaje:", lastMessage);

  const lastDate = new Date(lastMessage).getTime();
  const now = Date.now();
  const diffInHours = (now - lastDate) / (1000 * 60 * 60);

  console.log("lastDate:", lastDate);
  console.log("now:", now);
  
  return diffInHours >= thresholdHours;
};

export { hasBeenLongEnough };
