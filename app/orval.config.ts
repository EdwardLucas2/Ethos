import { defineConfig } from 'orval';

export default defineConfig({
    ethos: {
        input: '../api/openapi.yaml',
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
