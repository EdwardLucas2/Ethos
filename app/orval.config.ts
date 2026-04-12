import { defineConfig } from 'orval';

export default defineConfig({
    ethos: {
        input: 'http://localhost:8080/openapi.json',
        output: {
            target: './src/api/index.ts',
            client: 'react-query',
            override: {
                mutator: {
                    path: './src/api/client.ts',
                    name: 'customFetch',
                },
            },
        },
    },
});
