const timeout = (num: number) => new Promise((res) => setTimeout(res, num));

const User = ({ slug, isExporting }) => {
  return (
    <>
      <div id="test">{slug}</div>
      <div id="test-export">{isExporting ? 'exporting' : 'not-exporting'}</div>
    </>
  );
};

export function getProps({ params, isExporting }) {
  return { props: { ...params, isExporting } };
}

export async function getPaths() {
  await timeout(1000);
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

export default User;
