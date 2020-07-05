export function calculateOffset(el, scrollTop) {
  if (!el) {
    return 0;
  }

  return calculateTopPosition(el) + (el.offsetHeight - scrollTop - window.innerHeight);
}

export function calculateTopPosition(el) {
  if (!el) {
    return 0;
  }
  return el.offsetTop + calculateTopPosition(el.offsetParent);
}

export function isPassiveSupported() {
  let passive = false;

  const testOptions = {
    get passive() {
      passive = true;
      return true;
    },
  };

  try {
    //@ts-ignore
    document.addEventListener("test", null, testOptions);
    //@ts-ignore
    document.removeEventListener("test", null, testOptions);
  } catch (e) {
    // ignore
  }
  return passive;
}

export function mousewheelListener(e) {
  // Prevents Chrome hangups
  // See: https://stackoverflow.com/questions/47524205/random-high-content-download-time-in-chrome/47684257#47684257
  if (e.deltaY === 1 && !isPassiveSupported()) {
    e.preventDefault();
  }
}

export function hasOffsetParent(el) {
  return el && el.offsetParent !== null;
}
