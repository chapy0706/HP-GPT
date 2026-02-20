// /scripts/offline-verify.mjs
import { checkOfflineContracts } from "./offline-contract.mjs";

const failures = checkOfflineContracts({ rootDir: process.cwd() });

if (failures.length > 0) {
  console.error("\nOFFLINE VERIFY FAILED\n");
  for (const f of failures) console.error(`- ${f}`);
  console.error("\nこの verify は『ID/クラス/データファイルを壊していないか』をチェックします。\n" +
    "E2E (Playwright) はネットワーク無し環境だと導入が難しいので、まずはここを安定させます。\n");
  process.exitCode = 1;
} else {
  console.log("OFFLINE VERIFY PASSED");
}
