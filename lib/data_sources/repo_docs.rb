class RepoDocsDataSource < ::Nanoc::DataSources::FilesystemUnified
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
      item[:repo_docs] = c
      # TODO(ts): Document that repo doc index.md will be ignored.
      if item.identifier == '/'
        item[:nav] = { strip: true }
      end
      item
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
