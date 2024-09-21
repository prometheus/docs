require 'uri'
require 'yaml'

# The RepoDocs data source provides items sourced from other Git repositories.
# For a given repository_url, all git version tags are fetched and for the most
# recent (in order to save compilation time) tags the `docs/` folder in the
# respective `release-<version>` is checked out and its content mounted under
# the given `items_root`.
#
# As the Prometheus git repository includes several hundreds of megabytes of
# vendored assets, the repository is cloned bare and all blobs are filtered by
# default. Each version is then checked out in an individual working tree and
# git's spare-checkout feature is used to reduce the checkout to the `docs/`
# folder. The git data is cached in `tmp/repo_docs/`.
class RepoDocsDataSource < ::Nanoc::DataSource
  identifier :repo_docs

  DOCS_DIRECTORY = 'docs'.freeze
  BRANCH_PATTERN = 'release-*'.freeze
  VERSION_REGEXP = /\Av\d+\.\d+\.\d+\z/.freeze
  TMPDIR = 'tmp/repo_docs/'.freeze

  def up
    validate
    sync_repository
  end

  def items
    items_root = config.fetch(:items_root, '/')
    lts_releases = YAML.load_file('lts.yml').fetch(File.basename(git_remote).delete_suffix('.git'), [])
    latest = latest_version

    versions.inject([]) do |list, version|
      branch = "release-#{version}"
      dir = git_checkout(branch, DOCS_DIRECTORY)
      fs_config = { content_dir: dir, encoding: 'utf-8', identifier_type: 'legacy' }
      fs = ::Nanoc::DataSources::Filesystem.new(@site_config, '/', '/', fs_config)

      fs.items.each do |item|
        attrs = item.attributes.dup
        attrs[:nav] = { strip: true } if item.identifier == '/'
        attrs[:repo_docs] = {
          name: if lts_releases.include?(version) then "#{version} (LTS)" else version end,
          refspec: branch,
          version: version,
          latest: latest,
          items_root: items_root,
          version_root: File.join(items_root, version, '/'),
          canonical_root: File.join(items_root, 'latest', '/'),
          repository_url: git_remote,
          lts_release: lts_releases.include?(version),
          entrypoint: config[:config][:entrypoint],
        }

        if version == latest
          lattrs = attrs.dup
          lattrs[:repo_docs] = attrs[:repo_docs].dup
          lattrs[:repo_docs][:name] = "latest (#{version})"
          lattrs[:repo_docs][:version_root] = lattrs[:repo_docs][:canonical_root]
          list << new_item(item.content, lattrs, item.identifier.prefix('/latest'))
        end

        list << new_item(item.content, attrs, item.identifier.prefix('/' + version))
      end

      list
    end
  end

  private

  def validate
    if !config[:config].has_key?(:entrypoint)
      fail ArgumentError, 'entrypoint config option must be set'
    end
    if !config[:config].has_key?(:repository_url)
      fail ArgumentError, 'repository config option must be set'
    end
    URI(config[:config][:repository_url]) # raises an exception if invalid
  end

  def git_remote
    config[:config][:repository_url]
  end

  def git_dir
    basename = File.basename(git_remote)
    basename += '.git' unless basename.end_with?('.git')
    File.join(TMPDIR, basename)
  end

  def git_branches
    output = `cd #{git_dir} && git branch --format='%(refname:short)' --list '#{BRANCH_PATTERN}'`
    fail "Could not list git branches" if $?.exitstatus != 0
    output.split("\n")
  end

  def git_tags
    output = `cd #{git_dir} && git tag`
    fail "Could not list git tags" if $?.exitstatus != 0
    output.split("\n")
  end

  # git_checkout checks out the directory in the specified branch using git's
  # sparse checkout and returns the path to the location in the working tree.
  def git_checkout(branch, directory)
    # Location of checked out files in a linked working tree.
    working_tree = File.absolute_path(File.join(git_dir.delete_suffix('.git'), branch))

    checkout_config = File.join(git_dir, 'worktrees', branch, 'info', 'sparse-checkout')
    if !File.exist?(checkout_config) || !Dir.exist?(working_tree)
      run_command("rm -rf #{working_tree}")
      run_command("cd #{git_dir} && git worktree prune && git worktree add --no-checkout #{working_tree} #{branch}")
      Dir.mkdir(File.dirname(checkout_config)) if !Dir.exist?(File.dirname(checkout_config))
      File.write(checkout_config, "/#{directory}\n")
    end

    run_command("cd #{working_tree} && git reset --hard --quiet && git clean --force")
    File.join(working_tree, directory)
  end

  # sync_repository clones or updates a bare git repository and enables the
  # sparse checkout feature.
  def sync_repository
    if !Dir.exist?(git_dir)
      run_command("git clone --bare --filter=blob:none #{git_remote} #{git_dir}")
      run_command("cd #{git_dir} && git config core.sparseCheckout true")
    else
      run_command("cd #{git_dir} && git fetch --quiet")
    end
  end

  # versions returns an ordered list of major.minor version names for which
  # documentation should be published. Only the most recent versions for which a
  # corresponding release-* branch exists are returned.
  def versions
    branches = git_branches
    all = git_tags
      .select { |v| v.match(VERSION_REGEXP) }
      .map { |v| v.delete_prefix('v').split('.')[0, 2].join('.') }
      .uniq
      .select { |v| branches.include?('release-' + v) }
      .sort_by { |v| v.split('.').map(&:to_i) }
      .reverse

    # Number of versions is reduced to speed up site compilation time.
    grouped = all.group_by { |v| v.split('.').first }
    grouped.inject([]) do |list, (major, versions)|
      size = major == grouped.keys.first ? 10 : 1
      list += versions[0, size]
    end
  end

  # latest_version returns the latest released version.
  def latest_version
    tags = git_tags
    versions.find { |v| tags.any? { |t| t.start_with?('v' + v) && !t.include?('-') } }
  end

  def run_command(cmd)
    fail "Running command '#{cmd}' failed" if !system(cmd)
  end
end
