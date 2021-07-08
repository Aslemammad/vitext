const IndexPage = ({ slug }) => {
  return <div id="test">{slug}</div>;
};

export function getProps({params}) {
  return { props: params  };
}

export function getPaths() {
  return {
    paths: [
      {
        params: { slug: 1 },
      },
      {
        params: { slug: 2 },
      },
    ],
  };
}

export default IndexPage;
