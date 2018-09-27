# TODO(ts): Rewrite data source and use one single instance to combine all
# different versions for a given path.
class RepoDocsDataSource < ::Nanoc::DataSources::Filesystem
  identifier :repo_docs

  PATH = "repositories"

  def up
    c = config[:config]

    %x(
      scripts/checkout.sh \
        -d "#{docs_root}" \
        -t "#{repo_path}" \
        "#{c[:repository]}" "#{c[:refspec]}"
    )
    if $?.exitstatus != 0
      raise "Couldn't checkout repository #{c.inspect}"
    end

    super
  end

  def items
    c = config.fetch(:config)
    super.map do |item|
      attrs = item.attributes.dup
      attrs[:repo_docs] = c
      attrs[:repo_docs][:items_root] = config.fetch(:items_root)
      # TODO(ts): Remove assumptions about the path layout, rewrite datasource.
      attrs[:repo_docs][:version_root] = config.fetch(:items_root).sub(%r{(.+/)[^/]+/\Z}, '\\1')
      # TODO(ts): Document that repo doc index.md will be ignored.
      if item.identifier == '/'
        attrs[:nav] = { strip: true }
      end
      new_item(item.content, attrs, item.identifier)
    end
  end

  def content_dir_name
    File.join(repo_path, docs_root)
  end

  def layouts_dir_name
    'unsupported'
  end

  private

  def docs_root
    c = config.fetch(:config)
    c.fetch(:root, 'docs/')
  end

  def repo_path
    c = config.fetch(:config)
    base = c.fetch(:repo_base, 'repositories')
    File.join(base, File.basename(c[:repository]), c[:name])
  end
end
