# encoding: utf-8

# Adapted from the admonition code on http://nanoc.ws/
class AdmonitionFilter < Nanoc::Filter

  identifier :admonition

  BOOTSTRAP_MAPPING = {
    'tip'     => 'info',
    'note'    => 'info',
    'caution' => 'warning',
    'todo'    => 'info',
  }

  def run(content, params = {})
    # `#dup` is necessary because `.fragment` modifies the incoming string. Ew!
    # See https://github.com/sparklemotion/nokogiri/issues/1077
    doc = Nokogiri::HTML.fragment(content.dup)
    doc.css('p').each do |para|
      content = para.inner_html
      next if content !~ /\A(TIP|NOTE|CAUTION|TODO): (.*)\Z/m
      new_content = generate($1.downcase, $2)
      para.replace(new_content)
    end
    doc.to_s
  end

  def generate(kind, content)
    %[<div class="admonition-wrapper #{kind}">] +
    %[<div class="admonition alert alert-#{BOOTSTRAP_MAPPING[kind]}">] +
    "<strong>#{kind.upcase}:</strong> " +
    content +
    %[</div></div>]
  end

end
