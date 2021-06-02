export interface PageFileType {
  default: React.ComponentType<any>;
  getServerSideProps: any;
  getStaticProps: any;
  getStaticPaths: any;
}
