import { Suspense } from "react";
// import './App.css'
import PageLoader from "./PageLoader";
import MainRoute from "./routes";

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <MainRoute />
    </Suspense>
  );
}

export default App;
