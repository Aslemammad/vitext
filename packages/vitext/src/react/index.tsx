import * as React from 'react/index';

type Props = {
  progressive?: boolean;
  server?: boolean;
};

const SuspenseServer: React.ComponentType<React.SuspenseProps & Props> = ({
  fallback,
  }) => {
  return <>{fallback}</>
};

const isServerSide = typeof window === 'undefined';

const injectedReact: typeof React = {
  ...React,
  Suspense: isServerSide ? SuspenseServer as any : React.Suspense,
};

const {
  lazy,
  Children,
  Component,
  Fragment,
  Profiler,
  PureComponent,
  StrictMode,
  cloneElement,
  createContext,
  createElement,
  createFactory,
  createRef,
  forwardRef,
  isValidElement,
  memo,
  useCallback,
  useContext,
  useDebugValue,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  version,
  Suspense
} = injectedReact;

export {
  Children,
  Component,
  Fragment,
  Profiler,
  PureComponent,
  StrictMode,
  cloneElement,
  createContext,
  createElement,
  createFactory,
  createRef,
  forwardRef,
  isValidElement,
  memo,
  useCallback,
  useContext,
  useDebugValue,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  version,
  lazy,
  Suspense,
};

export default injectedReact

