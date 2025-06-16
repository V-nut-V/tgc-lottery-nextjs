export function drawPrizeAndUpdate(originalPrizeArray) {
  // 创建深拷贝，避免修改原始数据
  const prizeArray = originalPrizeArray.map((p) => ({ ...p }));

  const totalQuantity = prizeArray.reduce(
    (sum, item) => sum + item.Quantity,
    0
  );
  if (totalQuantity === 0) return null;

  const randomNum = Math.floor(Math.random() * totalQuantity) + 1;

  let cumulative = 0;
  let selectedPrize = null;

  for (let prize of prizeArray) {
    cumulative += prize.Quantity;
    if (randomNum <= cumulative) {
      prize.Quantity--;
      selectedPrize = { ...prize, Quantity: 1 }; // 复制抽中的奖项（表示抽中1个）
      break;
    }
  }

  return {
    selected: selectedPrize,
    afterPrizes: prizeArray,
  };
}

export function rollPrizeText(prizeArray, getFinalPrizeFn, setRollingText, stopFn) {
  if (!Array.isArray(prizeArray)) {
    throw new Error("Invalid prizeArray passed to rollPrizeText");
  }
  const names = prizeArray.map((p) => p.Name);
  let index = 0;
  let rollingTimer = null;
  let checkingTimer = null;

  function startRolling() {
    rollingTimer = setInterval(() => {
      setRollingText(names[index % names.length]);
      index++;
    }, 100);
  }

  function stopRolling() {
    stopFn();
    clearInterval(rollingTimer);
    clearInterval(checkingTimer);
  }

  startRolling();

  // 开始2秒计时
  setTimeout(() => {
    const finalPrize = getFinalPrizeFn();
    if (isValidPrize(finalPrize)) {
      stopRolling();
      setRollingText(finalPrize);
    } else {
      checkingTimer = setInterval(() => {
        const prize = getFinalPrizeFn();
        if (isValidPrize(prize)) {
          stopRolling();
          setRollingText(prize);
        }
      }, 1000);
    }
  }, 2000);

  function isValidPrize(prize) {
    return typeof prize === "string" && prize.trim().length > 0;
  }

  // 返回控制器（可选使用）
  return {
    stop: stopRolling,
  };
}

export function isPrizePoolEmpty(prizeArray) {
  if (!Array.isArray(prizeArray)) {
    throw new Error("Invalid prizeArray passed to isPrizePoolEmpty");
  }
  const totalQuantity = prizeArray.reduce(
    (sum, item) => sum + item.Quantity,
    0
  );
  return totalQuantity === 0;
}
