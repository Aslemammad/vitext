const IndexPage = ({ text }) => {
  return <div id="test">{text}</div>;
};

export function getProps() {
  console.log('hello')
  return { props: { text: 'Hello World' } };
}

export default IndexPage;
