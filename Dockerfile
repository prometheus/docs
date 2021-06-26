FROM    ruby:2.7
EXPOSE  3000
WORKDIR /usr/src/app
COPY    Gemfile /usr/src/app/
COPY    Gemfile.lock /usr/src/app/
RUN     gem update bundler
RUN     bundle install
COPY    . /usr/src/app
RUN     bundle exec nanoc --verbose
CMD     bundle exec nanoc view --host 0.0.0.0
VOLUME  output
