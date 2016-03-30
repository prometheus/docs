def nav(root_item, buffer='', layer=0)
  return buffer if root_item.nil? || root_item.path.nil? || root_item[:is_hidden]

  if nav_active?(root_item)
    buffer << "<li class=\"active\">"
  else
    buffer << "<li>"
  end

  title = nav_title_of(root_item)
  if layer == 0
    buffer << "<span class=\"nav-header\"><i class=\"fa fa-#{root_item[:nav_icon]}\"></i> #{title}</span>"
  else
    buffer << link_to(title, root_item.path)
  end

  children = nav_children(root_item)
  if children.any?
    buffer << '<ul class="nav">'

    children.each do |child|
      nav(child, buffer, layer + 1)
    end

    buffer << '</ul>'
  end

  buffer << '</li>'
  buffer
end

def nav_active?(item)
  @item_rep.respond_to?(:path) && @item_rep.path == item.path
end

def nav_title_of(i)
  i[:nav_title] || i[:title] || ''
end

def nav_children(item)
  item.children
    .select { |child| !child[:is_hidden] && child.path }
    .sort_by { |child| child[:sort_rank] || 0 }
end
