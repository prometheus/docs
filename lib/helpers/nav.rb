def nav_title_of(i)
  i[:nav_title] || i[:title] || ''
end

def nav(root_item, focused_item, buffer='', layer=0)
  # Skip non-written or hidden items
  return buffer if root_item.nil? || root_item.path.nil? || root_item[:is_hidden]

  # Open list element
  is_active = @item_rep && @item_rep.path == root_item.path
  if is_active
    buffer << "<li class=\"active\">"
  else
    buffer << "<li>"
  end

  title = nav_title_of(root_item)
  if layer == 0
    # Add section header.
    buffer << "<span class=\"nav-header\"><i class=\"fa fa-#{root_item[:nav_icon]}\"></i> #{title}</span>"
  else
    # Add link.
    buffer << link_to(title, root_item.path)
  end

  # Add children to sitemap, recursively
  visible_children = root_item.children.select { |child| !child[:is_hidden] && child.path }
  visible_children = visible_children.sort_by { |child| child[:sort_rank] || 0 }
  if visible_children.size > 0
    buffer << '<ul class="nav">'

    visible_children.each do |child|
      nav(child, focused_item, buffer, layer + 1)
    end

    buffer << '</ul>'
  end

  # Close list element
  buffer << '</li>'

  # Return sitemap
  buffer
end
