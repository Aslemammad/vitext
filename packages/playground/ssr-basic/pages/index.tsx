const IndexPage = ({ text }) => {
  return <div id="test">{text}</div>;
};

export function getProps() {
  return { props: { text: 'IndexPage' } };
}

export default IndexPage;
