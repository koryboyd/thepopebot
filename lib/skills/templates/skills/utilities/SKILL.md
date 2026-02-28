---
name: utilities
description: "General-purpose utility skill: self-modification, browser automation helpers, and secret management."
---

This skill bundles several helper scripts that an agent can invoke when it needs to:

* modify its own source code or configuration (use with extreme caution).
* interact with a local or headless browser for automation or scraping.
* store or retrieve sensitive values without leaking them in prompts.

Each of the JavaScript modules below exposes a simple API. The agent can `import` them from the `skills/utilities` directory when executing jobs.

```javascript
// example usage in an agent job
import { modifySelf, browse, getSecret } from './skills/utilities/utils.js';

await modifySelf('Add a new cron job');
const html = await browse('https://example.com');
const apiKey = getSecret('OPENAI_API_KEY');
```

Note that these modules are only examples; production deployments should review, sandbox, and restrict them appropriately.
