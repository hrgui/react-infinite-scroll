import React, { useRef, useEffect } from "react";

interface InfiniteScrollProps {
  loadMore?: (page?: number) => any;
  hasMore?: boolean;
  initialLoad?: boolean;
  pageStart?: number;
  threshold?: number;
  useWindow?: boolean;
  isReverse?: boolean;
  useCapture?: boolean;
  getScrollParent?: (() => any) | null
}

export function useInfiniteScroll({
  loadMore = () => null,
  hasMore = false,
  initialLoad = true,
  pageStart = 0,
  threshold = 250,
  useWindow = true,
  isReverse = false,
  useCapture = false,
  getScrollParent = null
}  : InfiniteScrollProps = {}) {
  const pageLoadedRef = useRef<any>();
  const optionsRef = useRef<any>();
  const scrollComponentRef = useRef<any>();
  const loadMoreRef = useRef<any>();
  const beforeScrollHeightRef = useRef<any>();
  const beforeScrollTopRef = useRef<any>();
  const componentDidMountRef = useRef<any>();

  const eventListenerOptions = React.useCallback(
    function eventListenerOptions() {
      let options: any = useCapture;
      if (isPassiveSupported()) {
        options = {
          useCapture: useCapture,
          passive: true
        };
      } else {
        options = {
          passive: false
        };
      }
      return options;
    },
    [useCapture]
  );

  const detachMousewheelListener = React.useCallback(
    function detachMousewheelListener() {
      let scrollEl = window;
      if (useWindow === false) {
        scrollEl = scrollComponentRef.current!.parentNode;
      }

      scrollEl.removeEventListener(
        "mousewheel",
        mousewheelListener,
        optionsRef.current ? optionsRef.current : useCapture
      );
    },
    [useWindow, useCapture]
  );

  const getParentElement = React.useCallback(
    function getParentElement(el) {
      const scrollParent = getScrollParent && getScrollParent();
      if (scrollParent !== null) {
        return scrollParent;
      }
      return el && el.parentNode;
    },
    [getScrollParent]
  );

  useEffect(
    function() {
      function detachScrollListener() {
        let scrollEl = window;
        if (useWindow === false) {
          scrollEl = getParentElement(scrollComponentRef.current);
        }

        scrollEl.removeEventListener(
          "scroll",
          scrollListener,
          optionsRef.current ? optionsRef.current : useCapture
        );
        scrollEl.removeEventListener(
          "resize",
          scrollListener,
          optionsRef.current ? optionsRef.current : useCapture
        );
      }

      function scrollListener() {
        const el = scrollComponentRef.current;
        const scrollEl = window;
        const parentNode = getParentElement(el);

        let offset;
        if (useWindow) {
          const doc =
            document.documentElement ||
            document.body.parentNode ||
            document.body;
          const scrollTop =
            scrollEl.pageYOffset !== undefined
              ? scrollEl.pageYOffset
              : doc.scrollTop;
          if (isReverse) {
            offset = scrollTop;
          } else {
            offset = calculateOffset(el, scrollTop);
          }
        } else if (isReverse) {
          offset = parentNode.scrollTop;
        } else {
          offset =
            el.scrollHeight - parentNode.scrollTop - parentNode.clientHeight;
        }

        // Here we make sure the element is visible as well as checking the offset
        if (offset < Number(threshold) && (el && el.offsetParent !== null)) {
          detachScrollListener();
          beforeScrollHeightRef.current = parentNode.scrollHeight;
          beforeScrollTopRef.current = parentNode.scrollTop;
          // Call loadMore after detachScrollListener to allow for non-async loadMore functions
          if (typeof loadMore === "function") {
            loadMore((pageLoadedRef.current += 1));
            loadMoreRef.current = true;
          }
        }
      }

      function attachScrollListener() {
        const parentElement = getParentElement(scrollComponentRef.current);

        if (!hasMore || !parentElement) {
          return;
        }

        let scrollEl = window;
        if (useWindow === false) {
          scrollEl = parentElement;
        }

        scrollEl.addEventListener(
          "mousewheel",
          mousewheelListener,
          optionsRef.current ? optionsRef.current : useCapture
        );
        scrollEl.addEventListener(
          "scroll",
          scrollListener,
          optionsRef.current ? optionsRef.current : useCapture
        );
        scrollEl.addEventListener(
          "resize",
          scrollListener,
          optionsRef.current ? optionsRef.current : useCapture
        );

        if (initialLoad) {
          scrollListener();
        }
      }

      function componentDidMount() {
        pageLoadedRef.current = pageStart;
        optionsRef.current = eventListenerOptions();
        attachScrollListener();
      }

      function componentDidUpdate() {
        if (isReverse && loadMoreRef.current) {
          const parentElement = getParentElement(scrollComponentRef.current);
          parentElement.scrollTop =
            parentElement.scrollHeight -
            beforeScrollHeightRef.current +
            beforeScrollTopRef.current;
          loadMoreRef.current = false;
        }
        attachScrollListener();
      }

      if (!componentDidMountRef.current) {
        componentDidMount();
        componentDidMountRef.current = true;
        return;
      }

      componentDidUpdate();

      return () => {
        detachScrollListener();
        detachMousewheelListener();
      };
    },
    [
      isReverse,
      loadMore,
      useCapture,
      useWindow,
      hasMore,
      initialLoad,
      pageStart,
      threshold,
      detachMousewheelListener,
      eventListenerOptions,
      getParentElement
    ]
  );

  return [scrollComponentRef];
}

function calculateOffset(el, scrollTop) {
  if (!el) {
    return 0;
  }

  return (
    calculateTopPosition(el) +
    (el.offsetHeight - scrollTop - window.innerHeight)
  );
}

function calculateTopPosition(el) {
  if (!el) {
    return 0;
  }
  return el.offsetTop + calculateTopPosition(el.offsetParent);
}

function isPassiveSupported() {
  let passive = false;

  const testOptions = {
    get passive() {
      passive = true;
      return true;
    }
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

function mousewheelListener(e) {
  // Prevents Chrome hangups
  // See: https://stackoverflow.com/questions/47524205/random-high-content-download-time-in-chrome/47684257#47684257
  if (e.deltaY === 1 && !isPassiveSupported()) {
    e.preventDefault();
  }
}

export function InfiniteScroll(renderProps) {
  const {
    children,
    element = "div",
    hasMore,
    initialLoad,
    isReverse,
    loader,
    loadMore,
    pageStart,
    ref,
    threshold,
    useCapture,
    useWindow,
    getScrollParent,
    ...props
  } = renderProps;
  const [scrollComponentRef] = useInfiniteScroll({
    loadMore,
    hasMore,
    pageStart,
    threshold,
    useCapture,
    useWindow,
    getScrollParent
  });
  const defaultLoader = <div key={"loader"}>Loading</div>;

  props.ref = scrollComponentRef;

  const childrenArray = [children];
  if (hasMore) {
    if (loader) {
      isReverse ? childrenArray.unshift(loader) : childrenArray.push(loader);
    } else if (defaultLoader) {
      isReverse
        ? childrenArray.unshift(defaultLoader)
        : childrenArray.push(defaultLoader);
    }
  }
  return React.createElement(element, props, childrenArray);
}
