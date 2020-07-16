# encoding: utf-8

require 'nokogiri'

class PrerelaseContent < ::Nanoc::Filter
  identifier :prerelease_content

  def run(content, params = {})
    doc = Nokogiri::HTML(content)
    # TODO(ts): We need to link to the same page or the first child without hardcoding /getting_started/.
    warning = %(<p>CAUTION: This page documents a pre-release version of #{params[:repository].split("/")[-1].split(".")[0].capitalize()}.
      Check out the <a href="#{params[:prelease]}">latest stable version</a>.</p>)

    body = doc.css('body')
    if first = body.children.first
      first.add_previous_sibling(warning)
    else
      body << Nokogiri::HTML::DocumentFragment.parse(warning)
    end

    doc.to_s
  end
end
