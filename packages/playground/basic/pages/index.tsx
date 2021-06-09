import React from 'react';
import { Helmet } from 'react-helmet-async';

const IndexPage = () => {
  return (
    <>
      <Helmet>
        <title>Hello World</title>
      </Helmet>
      <div id="test">IndexPage</div>
    </>
  );
};

export default IndexPage;
