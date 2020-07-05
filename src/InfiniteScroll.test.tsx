import { InfiniteScroll } from "./InfiniteScroll";
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { mocked } from "ts-jest/utils";
import { calculateOffset, hasOffsetParent } from "./utils";
import { act } from "react-dom/test-utils";

const _calculateOffset = mocked(calculateOffset);
const _hasOffsetParent = mocked(hasOffsetParent);

jest.mock("./utils");

it("should render normally in a scenario where there is no more to render", () => {
  function NoMoreItemsComponent() {
    const [items, setItems] = React.useState([0, 1]);
    const loadMore = React.useCallback(() => {
      setTimeout(() => {
        setItems([...items, items.length]);
      }, Math.ceil(1500 * Math.random()));
    }, [setItems, items]);

    return (
      <InfiniteScroll loadMore={loadMore} hasMore={false}>
        {items.map((i) => (
          <div key={i}>{`Item ${i}`}</div>
        ))}
      </InfiniteScroll>
    );
  }

  const { getAllByText } = render(<NoMoreItemsComponent />);
  expect(getAllByText(/Item \d/).length).toEqual(2);
});

it("should fire the loadMore function if hasMore = true and it knows it has to fire the loadMore function", async () => {
  const loadMoreJestFn = jest.fn();

  _calculateOffset.mockReturnValueOnce(25);
  _calculateOffset.mockReturnValueOnce(25);
  _hasOffsetParent.mockReturnValueOnce(true);
  _hasOffsetParent.mockReturnValueOnce(true);

  function LoadItemsComponent() {
    const [items, setItems] = React.useState([0, 1]);
    const loadMore = React.useCallback(
      (x) => {
        setTimeout(() => {
          loadMoreJestFn(x);
          setItems([...items, items.length]);
        }, 150);
      },
      [setItems, items]
    );

    return (
      <InfiniteScroll loadMore={loadMore} hasMore={true}>
        {items.map((i) => (
          <div key={i}>{`Item ${i}`}</div>
        ))}
      </InfiniteScroll>
    );
  }

  const { getAllByText, container, debug } = render(<LoadItemsComponent />);
  expect(getAllByText(/Item \d/).length).toEqual(2);
  expect(getAllByText(/Loading/).length).toEqual(1);

  act(() => {
    fireEvent.scroll(window);
  });

  await waitFor(() => {
    expect(loadMoreJestFn).toHaveBeenCalled();
    return expect(loadMoreJestFn).toHaveBeenCalledWith(2);
  });
  expect(getAllByText(/Item \d/).length).toEqual(4); // Item 3 renders
});
