FROM debian AS hunspell

RUN apt update
RUN apt install autoconf automake autopoint libtool git gettext gcc g++ make -y

RUN git clone --depth 1 https://github.com/hunspell/hunspell /hunspell
WORKDIR /hunspell
RUN autoreconf -vfi
RUN ./configure
RUN make
RUN make install
RUN ldconfig

FROM debian AS deno

RUN apt update
RUN apt install curl unzip -y
RUN curl -fsSL https://deno.land/install.sh | sh
RUN /root/.deno/bin/deno upgrade --canary

FROM debian

COPY --from=hunspell /usr/local/lib/libhunspell* /usr/local/lib
COPY --from=deno /root/.deno /root/.deno

WORKDIR /app
COPY . .
RUN /root/.deno/bin/deno cache server.ts

ENV LD_LIBRARY_PATH=/usr/local/lib
CMD ["/root/.deno/bin/deno", "run", "-A", "server.ts"]
