FROM scratch

HEALTHCHECK --retries=10 CMD [ "/dashboard", "-url", "https://localhost:1080/health" ]

VOLUME /var/run/docker.sock

EXPOSE 1080

ENTRYPOINT [ "/dashboard" ]

COPY cacert.pem /etc/ssl/certs/ca-certificates.crt
COPY bin/dashboard /dashboard
