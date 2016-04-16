require 'json'

module Downloads
  # repositories returns a list of all repositories with releases.
  def self.repositories
    @repositories ||= begin
      repos = Dir.glob('downloads/*').map { |dir| Repository.new(dir) }
      repos.sort_by { |r| r.name == 'prometheus' ? '0' : r.name }
    end
  end

  # operating_systems returns a list of all operating systems downloads can be
  # provided for.
  def self.operating_systems
    repositories.inject([]) do |list, repo|
      list += repo.releases.map { |r| r.assets.map(&:os) }.flatten
    end.uniq.sort
  end

  # architectures returns a list of all architectures downloads can be
  # provided for.
  def self.architectures
    repositories.inject([]) do |list, repo|
      list += repo.releases.map { |r| r.assets.map(&:arch) }.flatten
    end.uniq.sort
  end

  class Repository
    def initialize(dir)
      @repo = JSON.parse(File.read(File.join(dir, 'repo.json')))
      @releases = JSON.parse(File.read(File.join(dir, 'releases.json')))
    end

    def name
      @repo['name']
    end

    def full_name
      @repo['full_name']
    end

    def description
      @repo['description']
    end

    def url
      @repo['html_url']
    end

    def releases
      releases = []
      @releases.each do |r|
        if r['prerelease']
          releases << r if releases.empty?
        else
          releases << r
          break
        end
      end
      releases.map { |r| Release.new(r) }
    end
  end

  class Release
    def initialize(data)
      @data = data
    end

    def name
      @data['name']
    end

    def url
      @data['html_url']
    end

    def prerelease
      @data['prerelease']
    end

    def assets
      @data['assets'].map { |d| Asset.new(d) }
    end
  end

  class Asset
    def initialize(data)
      @data = data
    end

    def name
      @data['name']
    end

    def url
      @data['url']
    end

    def kind
      'Binary'
    end

    # TODO(ts): validate
    def os
      name.split('.')[3].split('-').first
    end

    # TODO(ts): validate
    def arch
      name.split('.')[3].split('-').last
    end

    def size
      @data['size']
    end
  end
end
