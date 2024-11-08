import { useEffect } from "react";
import { honoClient } from "./client/client";

function App() {
  useEffect(() => {
    honoClient.blah
      .$get({
        query: {
          name: "shit",
        },
      })
      .then(async (res) => {
        console.log(await res.json());
      });
  }, []);

  return <div>Hey</div>;
}

export default App;
