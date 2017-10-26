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

  if nav_active?(root_item)
    buffer << "<li class=\"active #{"current" unless children.any?}\">"
  else
    buffer << "<li>"
  end

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
    buffer << %(<ul class="nav #{nav_active?(root_item) ? 'active' : ''}">)

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
