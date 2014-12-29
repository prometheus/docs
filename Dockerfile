FROM   ruby:2.1-onbuild
EXPOSE 3000
RUN    bundle exec nanoc
CMD    bundle exec nanoc view
VOLUME output
