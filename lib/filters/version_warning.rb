# encoding: utf-8

require 'nokogiri'

# VersionWarning adds a warning to the top of pre-release or outdated versioned
# documentation pages.
class VersionWarning < ::Nanoc::Filter
  identifier :version_warning

  def run(content, params = {})
    case version_compare(params[:version], params[:latest])
    when 1
      type = 'a pre-release version'
    when 0
      return content
    when -1
      if params[:lts_release]
        return content
      end
      type = 'an old version'
    end

    href = File.join(params[:canonical_root], params[:entrypoint])
    repo = File.basename(params[:repository_url], '.git').capitalize
    warning = %(<p>CAUTION: This page documents #{type} of #{repo}.
      Check out the <a href="#{href}">latest stable version</a>.</p>)

    prepend_warning(content, warning)
  end

  private

  def prepend_warning(content, warning)
    doc = Nokogiri::HTML(content)
    body = doc.css('body')
    if first = body.children.first
      first.add_previous_sibling(warning)
    else
      body << Nokogiri::HTML::DocumentFragment.parse(warning)
    end
    doc.to_s
  end

  def version_compare(a, b)
    a.split('.').map(&:to_i) <=> b.split('.').map(&:to_i)
  end
end
