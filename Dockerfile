FROM scratch

HEALTHCHECK --retries=10 CMD https://localhost:1080/health

VOLUME /var/run/docker.sock

EXPOSE 1080
ENTRYPOINT [ "/bin/sh" ]

COPY cacert.pem /etc/ssl/certs/ca-certificates.crt
COPY bin/dashboard /bin/sh
COPY doc/api.html /doc/api.html
