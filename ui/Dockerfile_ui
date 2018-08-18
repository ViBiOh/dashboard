FROM node:10 as builder

ENV APP_NAME ui
ENV WORKDIR /usr/src/app

WORKDIR ${WORKDIR}
COPY ./ ${WORKDIR}/

RUN make ${APP_NAME} \
 && mkdir -p /app \
 && cp -r dist/ /app/

FROM vibioh/viws

HEALTHCHECK --retries=10 CMD [ "/viws", "-url", "https://localhost:1080/health" ]

COPY --from=builder /app/dist/ /www/
