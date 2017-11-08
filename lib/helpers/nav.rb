def nav(root_item, buffer='', layer=0)
  return buffer if root_item.nil? || root_item.path.nil? || root_item[:is_hidden]

  children = nav_children(root_item)

  # Strip item from menu.
  if root_item[:nav] && root_item[:nav][:strip]
    children.each do |child|
      nav(child, buffer, layer)
    end
    return buffer
  end

  classes = []
  if nav_active?(root_item)
    classes << 'active'
    classes << 'current' unless children.any?
  end
  classes << 'hidden' if hidden?(root_item)
  buffer << (classes.any? ? %(<li class="#{classes.join(' ')}">) : '<li>')

  title = nav_title_of(root_item)
  if children.any?
    if layer == 0
      buffer << "<span class=\"nav-header\"><i class=\"fa fa-#{root_item[:nav_icon]}\"></i> <span>#{title}</span></span>"
    else
      buffer << "<span class=\"nav-subheader\">#{title}</span>"
    end
  else
    buffer << link_to(title, root_item.path)
  end

  if children.any?
    active = nav_active?(root_item)
    # TODO(ts): Remove the need to check for the layer.
    if layer == 0 && children.any? { |i| Versioned.versioned?(i) }
      buffer << Versioned.picker(children, @item_rep, active)
    end

    buffer << %(<ul class="nav #{active ? 'active' : ''}">)

    children.each do |child|
      nav(child, buffer, layer + 1)
    end

    buffer << '</ul>'
  end

  buffer << '</li>'
  buffer
end

def nav_active?(item)
  active = @item_rep.respond_to?(:path) && @item_rep.path == item.path
  active || nav_children(item).any? { |child| nav_active?(child) }
end

def nav_title_of(i)
  i[:nav_title] || i[:title] || ''
end

def nav_children(item)
  item.children
    .select { |child| !child[:is_hidden] && child.path }
    .sort_by { |child| child[:sort_rank] || 0 }
end

# hidden? returns true if the item is not part of the currently selected group.
def hidden?(item)
  Versioned.versioned?(item) && !Versioned.current?(item[:repo_docs], @item_rep)
end

# Versioned repository docs related functions.
# TODO: Refactor and clean up all this code.
module Versioned
  def self.versioned?(item)
    !item[:repo_docs].nil?
  end

  # latest? returns true if the item is part of the version group "latest".
  def self.latest?(opts)
    opts[:name].include?('latest')
  end

  # current? returns true if the item is part of the selected version group. If
  # no group is selected (e.g. when a page outside of the versioned docs is
  # viewed), the latest version will be shown.
  def self.current?(opts, page)
    return false if opts.nil? || !page.respond_to?(:path)

    if page.path.start_with?(opts[:version_root])
      page.path.start_with?(opts[:items_root])
    else
      latest?(opts)
    end
  end

  # picker returns the HTML code for a version select box.
  def self.picker(items, page, active)
    versions = items.map { |i| i[:repo_docs] }.uniq
    options = versions.map do |v|
      selected = current?(v, page) ? 'selected="selected"' : ''
      # TODO(ts): Refactor and think about linking directly to the page of the same version.
      first = items
        .find { |i| i.path.start_with?(v[:items_root]) }
        .children.sort_by { |c| c[:sort_rank] || 0 }.first
      %(<option value="#{first.path}" #{selected}>#{v[:name]}</option>)
    end
    classes = active ? 'active' : ''
    return %(<div class="#{classes}">Version: <select>#{options.join('')}</select></div>)
  end
end
