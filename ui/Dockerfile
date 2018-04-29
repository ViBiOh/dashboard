FROM vibioh/viws

HEALTHCHECK --retries=10 CMD [ "/viws", "-url", "https://localhost:1080/health" ]

COPY doc/api.html /doc/api.html
COPY dist/ /www/
