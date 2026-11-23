
import { app } from "./app.js";
import { config } from "./config.js";

app.listen(config.PORT, "0.0.0.0", () => {
  console.log(
    `[Backend_Klinik] API listening on port ${config.PORT}`,
  );
});
