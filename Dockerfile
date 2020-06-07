FROM   ruby:2.4-onbuild
EXPOSE 3000
RUN    bundle exec nanoc
CMD    bundle exec nanoc view --host 0.0.0.0
VOLUME output
